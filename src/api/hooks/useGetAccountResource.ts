import {Types} from "aptos";
import {useQuery, UseQueryResult} from "@tanstack/react-query";
import {ResponseError, ResponseErrorType} from "../client";
import {useGlobalState} from "../../global-config/GlobalConfig";
import {orderBy} from "lodash";
import {fetchIndexerGraphql} from "../indexerGraphql";
import {tryStandardizeAddress} from "../../utils";

type IndexerAccountResourceResponse = {
  move_resources: Array<{
    type: string;
    data: Types.MoveResource["data"];
  }>;
};

const ACCOUNT_RESOURCE_QUERY = `
  query AccountResource($address: String, $type: String) {
    move_resources(
      where: {address: {_eq: $address}, type: {_eq: $type}}
      limit: 1
    ) {
      type
      data
    }
  }
`;

export type ModuleMetadata = {
  name: string;
  source: string;
};

export type UpgradePolicy = {
  // 0 is arbitrary, i.e. publisher can upgrade anyway they want, they need to migrate the data manually
  // 1 is compatible
  // 2 is immutable
  policy: number;
};

export type PackageMetadata = {
  name: string;
  modules: ModuleMetadata[];
  upgrade_policy: UpgradePolicy;
  // The numbers of times this module has been upgraded. Also serves as the on-chain version.
  upgrade_number: string;
  // The source digest of the sources in the package. This is constructed by first building the
  // sha256 of each individual source, than sorting them alphabetically, and sha256 them again.
  source_digest: string;
  // Move.toml file
  manifest: string;
};

export function useGetAccountResource(
  address: string | undefined,
  resource: string,
): UseQueryResult<Types.MoveResource, ResponseError> {
  const [state] = useGlobalState();

  return useQuery<Types.MoveResource, ResponseError>({
    queryKey: ["accountResource", {address, resource}, state.network_value],
    queryFn: async () => {
      if (!address) {
        throw new Error("Address is undefined");
      }
      const standardized = tryStandardizeAddress(address);
      if (!standardized) {
        throw {
          type: ResponseErrorType.INVALID_INPUT,
          message: `Invalid address '${address}'`,
        };
      }
      const data = await fetchIndexerGraphql<IndexerAccountResourceResponse>(
        state.network_name,
        ACCOUNT_RESOURCE_QUERY,
        {address: standardized, type: resource},
      );
      const resourceData = data.move_resources[0];
      if (!resourceData) {
        throw {type: ResponseErrorType.NOT_FOUND};
      }
      return {
        type: resourceData.type,
        data: resourceData.data,
      };
    },
    refetchOnWindowFocus: false,
  });
}

export function useGetAccountPackages(address: string) {
  const {data: registry} = useGetAccountResource(
    address,
    "0x1::code::PackageRegistry",
  );

  const registryData = registry?.data as {
    packages?: PackageMetadata[];
  };

  const packages: PackageMetadata[] =
    registryData?.packages?.map((pkg): PackageMetadata => {
      const sortedModules = orderBy(pkg.modules, "name");
      return {
        name: pkg.name,
        modules: sortedModules,
        upgrade_policy: pkg.upgrade_policy,
        upgrade_number: pkg.upgrade_number,
        source_digest: pkg.source_digest,
        manifest: pkg.manifest,
      };
    }) || [];

  return orderBy(packages, "name");
}

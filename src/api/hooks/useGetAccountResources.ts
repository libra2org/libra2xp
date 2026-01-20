import {Types} from "aptos";
import {useQuery, UseQueryResult} from "@tanstack/react-query";
import {ResponseError, ResponseErrorType} from "../client";
import {useGlobalState} from "../../global-config/GlobalConfig";
import {fetchIndexerGraphql} from "../indexerGraphql";
import {tryStandardizeAddress} from "../../utils";

type IndexerAccountResourcesResponse = {
  move_resources: Array<{
    type: string;
    data: Types.MoveResource["data"];
  }>;
};

const ACCOUNT_RESOURCES_QUERY = `
  query AccountResources($address: String) {
    move_resources(where: {address: {_eq: $address}}) {
      type
      data
    }
  }
`;

export function useGetAccountResources(
  address: string,
  options?: {
    retry?: number | boolean;
  },
): UseQueryResult<Types.MoveResource[], ResponseError> {
  const [state] = useGlobalState();

  return useQuery<Array<Types.MoveResource>, ResponseError>({
    queryKey: ["accountResources", {address}, state.network_value],
    queryFn: async () => {
      const standardized = tryStandardizeAddress(address);
      if (!standardized) {
        throw {
          type: ResponseErrorType.INVALID_INPUT,
          message: `Invalid address '${address}'`,
        };
      }
      const data = await fetchIndexerGraphql<IndexerAccountResourcesResponse>(
        state.network_name,
        ACCOUNT_RESOURCES_QUERY,
        {address: standardized},
      );
      return data.move_resources.map((resource) => ({
        type: resource.type,
        data: resource.data,
      }));
    },
    retry: options?.retry ?? false,
  });
}

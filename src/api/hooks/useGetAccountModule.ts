import {Types} from "aptos";
import {useQuery, UseQueryResult} from "@tanstack/react-query";
import {ResponseError, ResponseErrorType} from "../client";
import {useGlobalState} from "../../global-config/GlobalConfig";
import {fetchIndexerGraphql} from "../indexerGraphql";
import {tryStandardizeAddress} from "../../utils";

type IndexerAccountModuleResponse = {
  move_modules: Array<{
    bytecode: string;
    abi?: Types.MoveModule;
  }>;
};

const ACCOUNT_MODULE_QUERY = `
  query AccountModule($address: String, $name: String) {
    move_modules(
      where: {address: {_eq: $address}, name: {_eq: $name}}
      limit: 1
    ) {
      bytecode
      abi
    }
  }
`;

export function useGetAccountModule(
  address: string,
  moduleName: string,
): UseQueryResult<Types.MoveModuleBytecode, ResponseError> {
  const [state] = useGlobalState();

  return useQuery<Types.MoveModuleBytecode, ResponseError>({
    queryKey: ["accountModule", {address, moduleName}, state.network_value],
    queryFn: async () => {
      const standardized = tryStandardizeAddress(address);
      if (!standardized) {
        throw {
          type: ResponseErrorType.INVALID_INPUT,
          message: `Invalid address '${address}'`,
        };
      }
      const data = await fetchIndexerGraphql<IndexerAccountModuleResponse>(
        state.network_name,
        ACCOUNT_MODULE_QUERY,
        {address: standardized, name: moduleName},
      );
      const module = data.move_modules[0];
      if (!module) {
        throw {type: ResponseErrorType.NOT_FOUND};
      }
      return {
        bytecode: module.bytecode,
        abi: module.abi,
      };
    },
    refetchOnWindowFocus: false,
  });
}

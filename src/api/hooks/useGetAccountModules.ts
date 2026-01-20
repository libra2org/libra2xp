import {Types} from "aptos";
import {useQuery, UseQueryResult} from "@tanstack/react-query";
import {ResponseError, ResponseErrorType} from "../client";
import {useGlobalState} from "../../global-config/GlobalConfig";
import {fetchIndexerGraphql} from "../indexerGraphql";
import {tryStandardizeAddress} from "../../utils";

type IndexerAccountModulesResponse = {
  move_modules: Array<{
    bytecode: string;
    abi?: Types.MoveModule;
  }>;
};

const ACCOUNT_MODULES_QUERY = `
  query AccountModules($address: String) {
    move_modules(where: {address: {_eq: $address}}) {
      bytecode
      abi
    }
  }
`;

export function useGetAccountModules(
  address: string,
): UseQueryResult<Types.MoveModuleBytecode[], ResponseError> {
  const [state] = useGlobalState();

  return useQuery<Array<Types.MoveModuleBytecode>, ResponseError>({
    queryKey: ["accountModules", {address}, state.network_value],
    queryFn: async () => {
      const standardized = tryStandardizeAddress(address);
      if (!standardized) {
        throw {
          type: ResponseErrorType.INVALID_INPUT,
          message: `Invalid address '${address}'`,
        };
      }
      const data = await fetchIndexerGraphql<IndexerAccountModulesResponse>(
        state.network_name,
        ACCOUNT_MODULES_QUERY,
        {address: standardized},
      );
      return data.move_modules.map((module) => ({
        bytecode: module.bytecode,
        abi: module.abi,
      }));
    },
  });
}

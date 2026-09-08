export type RunDataMutation = (
  operation: () => Promise<void>,
) => Promise<boolean>

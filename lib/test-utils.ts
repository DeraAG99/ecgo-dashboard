export function buildSelectChain(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {
    from: () => chain,
    leftJoin: () => chain,
    rightJoin: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    groupBy: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    offset: () => chain,
    then: (resolve: (value: unknown) => void) => resolve(data),
  }
  return chain
}

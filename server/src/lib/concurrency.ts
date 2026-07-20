// Fans `items` out to `worker` with at most `limit` in flight at once.
// Duffel's search is a real, non-instant call to live airline systems —
// calendar (~30 dates) and everywhere (~45 destinations) searches would
// otherwise fire dozens of simultaneous requests per page load.
export async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

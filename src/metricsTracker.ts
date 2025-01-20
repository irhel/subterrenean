interface Metrics {
  bandwidth_usage: number, 
  top_sites: [string, number][],
  visits: {[key: string] : number}
}
// Reads from .env file number of top sites to keep track of and if it's not specified defaults to 10
export class MetricsTracker {
  private metrics: Metrics;
  private topK:number;
  constructor(topK:string | undefined) {
    if (topK) {
      this.topK = parseInt(topK);
    } else {
      this.topK = 10;
    }
    this.metrics = {
      bandwidth_usage: 0,
      top_sites: [ 
      ],
      visits: {

      }
    }
  }
  updateBandwidth(x: number) {
    this.metrics.bandwidth_usage += x;
  }
  updateVisit(url: string) {
    if (this.metrics.visits[url]) {
        this.metrics.visits[url]++;
    } else {
        this.metrics.visits[url] = 1;
    }
  }
  getPrettyPrintedBandwidth() {
    if (this.metrics.bandwidth_usage >= 10 ** 6) {
      return Math.round(this.metrics.bandwidth_usage / (1024 * 1024)) + 'MB'
    } else {
      return Math.round(this.metrics.bandwidth_usage / 1024) + 'KB'
    }
  }
  getMetrics() {
    let sortedVisits = Object.fromEntries(
      Object.entries(this.metrics.visits).sort(([, visitsA], [, visitsB]) => visitsB - visitsA).slice(0, this.topK))
    return {bandwidth_usage: this.getPrettyPrintedBandwidth(), top_sites: sortedVisits}
  }
}

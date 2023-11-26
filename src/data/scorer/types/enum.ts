export enum DataSourceType {
  LocalZip = 'Local',
  RemoteUrls = 'RemoteUrls',
  RemoteHFRepoZip = 'HFZip',
}

export enum ImageType {
    Local,
    Remote
}

export enum ScorerType {
  SKIP = "-1",
  LEFT = '0',
  RIGHT = '1',
  BOTH = '0.5'
}
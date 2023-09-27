module.exports = {
  write: {
    platform: 'notion',
    notion: {
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: 'type',
            select: {
              equals: 'Post'
            }
          }
        ]
      },
      sorts: 'updateTimeDesc'
    }
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './docs',
      filename: 'title',
      format: 'matter-markdown',
      catalog: false,
      formatExt: ''
    }
  },
  image: {
    enable: true,
    platform: 'cos',
    cos: {
      secretId: process.env.COS_SECRET_ID,
      secretKey: process.env.COS_SECRET_KEY,
      bucket: process.env.COS_BUCKET,
      region: process.env.COS_REGION,
      host: process.env.COS_HOST,
      prefixKey: '1874-blog-images',
      secretExt: '' // 可选
    }
  }
}

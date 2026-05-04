import { getCurrentFeaturedExample } from '../services/featuredExampleService.js'

export function getFeaturedExample(req, res) {
  const example = getCurrentFeaturedExample()

  res.json({
    prompt: example?.prompt || '',
    imageUrl: example?.imageUrl || '',
    updatedAt: example?.updatedAt || '',
  })
}

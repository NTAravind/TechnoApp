// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN! // Personal Access Token
const GITHUB_OWNER = process.env.GITHUB_OWNER! // Your GitHub username
const GITHUB_REPO = process.env.GITHUB_REPO! // Repository name (e.g., 'yarn-images')

export async function POST(request: NextRequest) {
  try {
    const { filename, content, message } = await request.json()
    
    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      )
    }

    // Create file in GitHub repository
    const githubResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/images/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: message || `Add image: ${filename}`,
          content: content, // Base64 encoded content
          branch: 'main'
        })
      }
    )

    if (!githubResponse.ok) {
      const error = await githubResponse.text()
      console.error('GitHub API Error:', error)
      return NextResponse.json(
        { error: 'Failed to upload to GitHub' },
        { status: githubResponse.status }
      )
    }

    const result = await githubResponse.json()
    
    // Return the jsDelivr CDN URL
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/images/${filename}`
    
    return NextResponse.json({
      success: true,
      url: result.content.download_url, // GitHub raw URL
      cdnUrl: cdnUrl, // jsDelivr CDN URL (faster)
      sha: result.content.sha
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
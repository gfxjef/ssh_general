from flask import Blueprint, jsonify, request
from datetime import datetime
from .models.post import Post

# Create API blueprint with /api prefix
bienestar_api_bp = Blueprint('bienestar_api', __name__, url_prefix='/api')

# API routes
@bienestar_api_bp.route('/posts', methods=['GET'])
def all_posts():
    """API for getting all posts"""
    posts = Post.get_all()
    return jsonify({'posts': [post.to_dict() for post in posts]})

@bienestar_api_bp.route('/posts/published', methods=['GET'])
def published_posts():
    """API for getting published posts"""
    posts = Post.get_published()
    return jsonify({'posts': [post.to_dict() for post in posts]})

@bienestar_api_bp.route('/posts/<post_id>', methods=['GET'])
def get_post(post_id):
    """API for getting a specific post by ID"""
    post = Post.get_by_id(post_id)
    if post:
        return jsonify(post.to_dict())
    return jsonify({'error': 'Post not found'}), 404

@bienestar_api_bp.route('/posts/save', methods=['POST'])
def save_post():
    """API for saving or updating a post"""
    try:
        data = request.json
        
        # Look up if post exists or create a new one
        post = Post()
        if 'id' in data and data['id']:
            existing_post = Post.get_by_id(data['id'])
            if existing_post:
                post = existing_post
        
        # Update post data
        post.title = data.get('title', '')
        post.content = data.get('content', '')
        post.excerpt = data.get('excerpt', '')
        post.category = data.get('category', '')
        post.tags = data.get('tags', [])
        post.status = data.get('status', 'draft')
        post.visibility = data.get('visibility', 'public')
        
        # Optional fields
        if 'targetGroup' in data and data['targetGroup']:
            post.target_group = data['targetGroup']
        
        if 'coverImage' in data and data['coverImage']:
            post.cover_image = data['coverImage']
        
        # Update timestamp
        post.updated = datetime.now().isoformat()
        
        # Save the post
        success = post.save()
        
        if success:
            return jsonify({'success': True, 'post': post.to_dict()})
        else:
            return jsonify({'success': False, 'error': 'Error saving post'}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bienestar_api_bp.route('/posts/delete/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    """API for deleting a post"""
    post = Post.get_by_id(post_id)
    if not post:
        return jsonify({'success': False, 'error': 'Post not found'}), 404
    
    success = post.delete()
    
    if success:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Error deleting post'}), 500

@bienestar_api_bp.route('/posts/update-status/<post_id>', methods=['PUT'])
def update_status(post_id):
    """API for updating a post's status (published/draft)"""
    post = Post.get_by_id(post_id)
    if not post:
        return jsonify({'success': False, 'error': 'Post not found'}), 404
    
    data = request.json
    post.status = data.get('status', 'draft')
    
    success = post.save()
    
    if success:
        return jsonify({'success': True, 'post': post.to_dict()})
    else:
        return jsonify({'success': False, 'error': 'Error updating post status'}), 500
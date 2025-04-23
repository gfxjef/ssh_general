import json
import os
import uuid
from datetime import datetime
from flask import current_app

class Post:
    """Class for managing posts"""
    
    def __init__(self):
        """Initialize a new blank post"""
        self.id = str(uuid.uuid4())
        self.title = ""
        self.content = ""
        self.excerpt = ""
        self.category = ""
        self.tags = []
        self.status = "draft"  # draft, published
        self.visibility = "public"  # public, sede, grupo
        self.target_group = None  # Only used if visibility is sede or grupo
        self.created = datetime.now().isoformat()
        self.updated = datetime.now().isoformat()
        self.cover_image = None
        self.author = "Equipo de Bienestar"
    
    @classmethod
    def get_all(cls):
        """Get all posts"""
        posts = []
        
        try:
            posts_file = current_app.config['POSTS_FILE']
            
            if os.path.exists(posts_file):
                with open(posts_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Check if 'posts' key exists in the JSON
                    if 'posts' in data:
                        posts_data = data['posts']
                    else:
                        posts_data = data
                    
                for post_data in posts_data:
                    post = cls()
                    for key, value in post_data.items():
                        # Convert keys from camelCase to snake_case as needed
                        attr_name = key
                        if key == 'coverImage':
                            attr_name = 'cover_image'
                        elif key == 'targetGroup':
                            attr_name = 'target_group'
                        elif key == 'featured_image':
                            attr_name = 'cover_image'
                        
                        if hasattr(post, attr_name):
                            setattr(post, attr_name, value)
                    posts.append(post)
                    
        except Exception as e:
            print(f"Error loading posts: {e}")
            
        return posts
    
    @classmethod
    def get_published(cls):
        """Get only published posts"""
        all_posts = cls.get_all()
        return [post for post in all_posts if post.status == 'published']
    
    @classmethod
    def get_by_id(cls, post_id):
        """Get a post by its ID"""
        all_posts = cls.get_all()
        for post in all_posts:
            if post.id == post_id:
                return post
        return None
    
    def save(self):
        """Save or update a post in the JSON file"""
        try:
            # Update modification date
            self.updated = datetime.now().isoformat()
            
            # Get all posts
            all_posts = self.get_all()
            
            # Check if post already exists
            existing_post_index = None
            for i, post in enumerate(all_posts):
                if post.id == self.id:
                    existing_post_index = i
                    break
            
            # Update existing post or add a new one
            if existing_post_index is not None:
                all_posts[existing_post_index] = self
            else:
                all_posts.append(self)
            
            # Save all posts to file
            posts_data = [post.to_dict() for post in all_posts]
            
            # Save with the correct structure
            data_to_save = {'posts': posts_data}
            with open(current_app.config['POSTS_FILE'], 'w', encoding='utf-8') as f:
                json.dump(data_to_save, f, ensure_ascii=False, indent=4)
            
            return True
        
        except Exception as e:
            print(f"Error saving post: {e}")
            return False
    
    def delete(self):
        """Delete a post from the JSON file"""
        try:
            # Get all posts
            all_posts = self.get_all()
            
            # Filter out the current post
            filtered_posts = [post for post in all_posts if post.id != self.id]
            
            # Save the updated list
            posts_data = [post.to_dict() for post in filtered_posts]
            
            # Save with the correct structure
            data_to_save = {'posts': posts_data}
            with open(current_app.config['POSTS_FILE'], 'w', encoding='utf-8') as f:
                json.dump(data_to_save, f, ensure_ascii=False, indent=4)
            
            return True
            
        except Exception as e:
            print(f"Error deleting post: {e}")
            return False
    
    def to_dict(self):
        """Convert the post to a dictionary"""
        data = {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "excerpt": self.excerpt,
            "category": self.category,
            "tags": self.tags,
            "status": self.status,
            "visibility": self.visibility,
            "created": self.created,
            "updated": self.updated,
            "author": self.author
        }
        
        # Only include these fields if they have value
        if self.cover_image:
            data["coverImage"] = self.cover_image
            
        if self.target_group:
            data["targetGroup"] = self.target_group
            
        return data
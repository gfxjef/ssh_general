from flask import Blueprint, render_template, request
import os

bienestar_bp = Blueprint('main', __name__, template_folder='../../templates')

@bienestar_bp.record
def record_params(setup_state):
    app = setup_state.app
    # Set the posts file path in app config if not already set
    if 'POSTS_FILE' not in app.config:
        app.config['POSTS_FILE'] = os.path.join(app.static_folder, 'data', 'posts_bienestar.json')

# Fix routes to be relative to the /bienestar prefix
@bienestar_bp.route('/', methods=['GET'])
def index():
    """Main page of the Bienestar module"""
    return render_template('bienestar/index.html')

@bienestar_bp.route('/manage-posts', methods=['GET'])
def manage_posts():
    return render_template('bienestar/manage-posts.html')

@bienestar_bp.route('/view-posts', methods=['GET'])
def view_posts():
    return render_template('bienestar/view-posts.html')

@bienestar_bp.route('/post-detail', methods=['GET'])
def post_detail():
    """Post detail page"""
    post_id = request.args.get('id')
    return render_template('bienestar/post-detail.html', post_id=post_id)

@bienestar_bp.route('/post-editor', methods=['GET'])
def post_editor():
    """Post editor page"""
    post_id = request.args.get('id', '')
    return render_template('bienestar/post-editor.html', post_id=post_id)
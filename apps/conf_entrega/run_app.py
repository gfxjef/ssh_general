import os
import sys

# Add the parent directory to sys.path to make Python recognize the module
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Import the app from the current directory
from conf_entrega.app import app

if __name__ == '__main__':
    # For development
    app.run(debug=True, host='0.0.0.0', port=5000)
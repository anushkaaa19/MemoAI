import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;
    
    // Check if authorization header exists and starts with Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user and attach to req (exclude password)
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                    statusCode: 401
                });
            }
            
            next(); // Token valid, proceed to next middleware/controller
            return; // IMPORTANT: Stop execution here
        } catch (error) {
            console.error(error);
            return res.status(401).json({
                success: false,
                error: 'Not authorized, token failed',
                statusCode: 401
            });
        }
    }
    
    // If no token or no authorization header
    return res.status(401).json({
        success: false,
        error: 'Not authorized, no token',
        statusCode: 401
    });
};

export default protect;
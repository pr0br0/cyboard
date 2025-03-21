const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phone: {
        number: {
            type: String,
            required: [true, 'Phone number is required']
        },
        verified: {
            type: Boolean,
            default: false
        },
        verificationCode: String,
        verificationExpires: Date
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    avatar: {
        url: String,
        public_id: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active'
    },
    location: {
        city: String,
        district: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    },
    preferences: {
        language: {
            type: String,
            enum: ['en', 'ru'],
            default: 'en'
        },
        currency: {
            type: String,
            enum: ['EUR', 'USD'],
            default: 'EUR'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    listings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    }],
    stats: {
        totalListings: {
            type: Number,
            default: 0
        },
        activeListings: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        responses: {
            type: Number,
            default: 0
        }
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    lastActive: Date,
    pushTokens: [String]
}, {
    timestamps: true
});

// Индексы
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'phone.number': 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

// Хуки
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Методы
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

userSchema.methods.generateVerificationToken = function() {
    const token = jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    this.verificationToken = token;
    return token;
};

userSchema.methods.generatePasswordResetToken = function() {
    const token = jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    this.resetPasswordToken = token;
    this.resetPasswordExpires = Date.now() + 3600000; // 1 час
    return token;
};

userSchema.methods.generatePhoneVerificationCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.phone.verificationCode = code;
    this.phone.verificationExpires = Date.now() + 600000; // 10 минут
    return code;
};

userSchema.methods.updateActivity = async function() {
    this.lastActive = new Date();
    await this.save();
};

userSchema.methods.updateStats = async function() {
    const [totalListings, activeListings] = await Promise.all([
        mongoose.model('Listing').countDocuments({ author: this._id }),
        mongoose.model('Listing').countDocuments({
            author: this._id,
            status: 'active',
            expiresAt: { $gt: new Date() }
        })
    ]);

    this.stats.totalListings = totalListings;
    this.stats.activeListings = activeListings;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
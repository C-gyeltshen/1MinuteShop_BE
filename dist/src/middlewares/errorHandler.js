export const errorHandler = async (c, next) => {
    try {
        await next();
    }
    catch (err) {
        // Log the error for debugging
        console.error("Unhandled error:", err);
        // Respond with a generic error message
        return c.json({
            success: false,
            message: err?.message || "Internal Server Error",
        }, 500);
    }
};

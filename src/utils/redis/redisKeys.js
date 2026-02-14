export const videoViewsKey = (videoId, userId) =>
  `video:view:${videoId}:${userId}`;
export const videoCounterKey = (videoId) => `video:${videoId}:views`;

// user-reaction state...
export const userReactionKey = (videoId, userId) =>
  `reaction:${videoId}:${userId}`;

// like counter
export const likesDeltaKey = (videoId) => `video:${videoId}:likes`;
// dislike counter
export const dislikesDeltaKey = (videoId) => `video:${videoId}:dislikes`;
export const dirtyVideosKey = () => `videos:dirty`;

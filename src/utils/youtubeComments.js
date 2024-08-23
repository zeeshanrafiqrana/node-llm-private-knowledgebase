import { google } from "googleapis";
const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_GOOGLE_API,
  });
export const getYoutubeComments = async () => {
    return new Promise((resolve, reject) => {
      youtube.commentThreads.list(
        {
          part: "snippet",
          videoId: process.env.YOUTUBE_VEDIO_ID,
          maxResults: 20,
        },
        (err, res) => {
          if (err) reject(err);
          let json = JSON.stringify(res.data.items);
          resolve(res.data.items);
        }
      );
    });
  };
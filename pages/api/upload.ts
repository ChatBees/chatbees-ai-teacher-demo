import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { createRouter } from "next-connect";
import type { NextHandler } from "next-connect";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/uploads",
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

const apiRoute = createRouter<NextApiRequest, NextApiResponse>();

apiRoute.use((req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
  upload.single("file")(req as any, res as any, next);
});

apiRoute.post((req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({ data: "success" });
});

apiRoute.use(
  (
    error: any,
    req: NextApiRequest,
    res: NextApiResponse,
    next: NextHandler
  ) => {
    res
      .status(501)
      .json({ error: `Sorry something happened! ${error.message}` });
  }
);

apiRoute.use((req: NextApiRequest, res: NextApiResponse) => {
  res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
});

export default apiRoute.handler();

export const config = {
  api: {
    bodyParser: false,
  },
};

export const sendSuccess = (res: any, data: unknown, status = 200) => {
  return res.status(status).json({ success: true, data });
};

export const sendError = (res: any, message: string, status = 500) => {
  return res.status(status).json({ success: false, message });
};

import Log from "../models/Log.js";

export const logAction = async ({ actionType, title, message, actor, metadata, status = 'Success' }) => {
  try {
    const ignoredActions = ['FETCH', 'VIEW'];
    if (ignoredActions.includes(actionType.toUpperCase())) return;

    await Log.create({
      actionType,
      title,
      message,
      actor,
      metadata,
      status
    });
  } catch (error) {
    console.error("Logger Error:", error);
  }
};
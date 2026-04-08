import { redis } from "../lib/redis";

const RESERVATION_SCRIPT = `
local availableKey = KEYS[1]
local hourKeyPrefix = KEYS[2]
local desiredAt = tonumber(ARGV[1])
local delayMs = tonumber(ARGV[2])
local hourlyLimit = tonumber(ARGV[3])
local hourMs = 3600000

local availableAt = tonumber(redis.call("GET", availableKey) or "0")
local candidate = math.max(desiredAt, availableAt)

while true do
  local hourBucket = math.floor(candidate / hourMs) * hourMs
  local hourKey = hourKeyPrefix .. hourBucket
  local count = tonumber(redis.call("GET", hourKey) or "0")

  if count < hourlyLimit then
    redis.call("INCR", hourKey)
    redis.call("PEXPIRE", hourKey, hourMs * 2)
    redis.call("SET", availableKey, candidate + delayMs)
    return { candidate, hourBucket, count + 1 }
  end

  candidate = hourBucket + hourMs

  if availableAt > candidate then
    candidate = availableAt
  end
end
`;

type ReserveSlotInput = {
  senderId: string;
  desiredAt: number;
  delayMs: number;
  hourlyLimit: number;
};

export const reserveEmailSlot = async ({
  senderId,
  desiredAt,
  delayMs,
  hourlyLimit,
}: ReserveSlotInput) => {
  const [scheduledAt, hourBucket] = (await redis.eval(
    RESERVATION_SCRIPT,
    2,
    `reachinbox:sender:${senderId}:available-at`,
    `reachinbox:sender:${senderId}:hour:`,
    desiredAt.toString(),
    delayMs.toString(),
    hourlyLimit.toString(),
  )) as [number, number, number];

  return {
    scheduledAt: new Date(Number(scheduledAt)),
hourBucket: new Date(Number(hourBucket)),
  };
};

-- 查出「李大牛」的 SecondMe access_token，用于 .env 的 SECONDME_DIRECTOR_TOKEN
-- 执行后把 access_token 复制到 .env 并设置 DIRECTOR_USE_SECONDME=true

SELECT
  u.id AS user_id,
  u.display_name,
  u.secondme_user_id,
  ot.access_token
FROM users u
JOIN oauth_tokens ot ON ot.user_id = u.id AND ot.provider = 'secondme'
WHERE u.display_name = '李大牛';

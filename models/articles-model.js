const db = require("../db/connection");
const format = require('pg-format')


exports.selectArticleById = async (articleId) => {
  const {rows: articles} = await db
  .query(`
  SELECT articles.*,
  COUNT(comments.comment_id) AS comment_count
  FROM articles
  LEFT JOIN comments ON comments.article_id = articles.article_id
  WHERE articles.article_id = $1
  GROUP BY articles.article_id;
  `, [
      articleId,
    ])

  if (articles.length === 0) {
    return Promise.reject({ status: 404, msg: "Not found" });
  }
  return articles[0];
};

exports.incrementVote = async (articleId, vote) => {
  if (!vote) {
    return Promise.reject({ status: 400, msg: "Invalid vote" });
  }
  return db
    .query("SELECT * FROM articles WHERE articles.article_id = $1;", [
      articleId,
    ])
    .then(({ rows: [article] }) => {
      article.votes = vote;
      return article; 
    });
};

exports.selectArticles = async (
  sort_by = 'created_at',
  order = 'desc',
  filter
  ) => {

    if (!['article_id', 'author', 'title', 'body', 'topic', 'created_at', 'votes'].includes(sort_by)) {
      return Promise.reject({status: 400, msg: "Invalid sort_by query"})
    }

    if (!['asc', 'desc'].includes(order)) {
      return Promise.reject({status: 400, msg: "Invalid order query"})
    }

    if (filter) {
      const topics = await db.query('SELECT slug FROM topics;')
      const topicSlugs = topics.rows.map((topic) => {
        const { slug } = topic;
        return slug
      })
  
      if (!topicSlugs.includes(filter)) {
        return Promise.reject({status: 400, msg: 'Invalid filter query'})
      }
    }
    

    const queryStr = format(`SELECT articles.*,
    COUNT(comments.comment_id) AS comment_count
    FROM articles
    LEFT JOIN comments ON comments.article_id = articles.article_id
    WHERE articles.topic = '${filter}'
    GROUP BY articles.article_id
    ORDER BY articles.${sort_by} ${order};;
    `)

  const {rows: articles} = await db.query(queryStr);
  return articles;
};



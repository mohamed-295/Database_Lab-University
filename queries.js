/**
 * Database lab — queries.js
 * ---------------------
 * Standalone script: connect to the same DB, run example aggregate SELECTs.
 * Run after you have submitted at least one CV via the web form:
 *   node queries.js
 *   npm run queries
 */

const { connectDb, getPool } = require('./db');

async function runQueries() {
  await connectDb();
  const pool = getPool();

  // —— QUERY 1: COUNT — how many courses per person (LEFT JOIN keeps people with 0 courses)
  console.log('\n── QUERY 1: Number of courses per person ──');

  const [courseCounts] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(c.idcourse) AS courseCount
    FROM person p
    LEFT JOIN course c ON c.person_idperson = p.idperson
    GROUP BY p.idperson
    ORDER BY courseCount DESC
  `);

  courseCounts.forEach(row =>
    console.log(`  ${row.fName} ${row.lName} → ${row.courseCount} course(s)`)
  );

  // —— QUERY 2: only persons with more than 1 project
  console.log('\n── QUERY 2: Persons with more than 1 project ──');

  const [topPerson] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(pr.idproject) AS projectCount
    FROM person p
    INNER JOIN project pr ON pr.person_idperson = p.idperson
    GROUP BY p.idperson
    HAVING projectCount > 1
    ORDER BY projectCount DESC
  `);

  if (topPerson.length > 0) {
    topPerson.forEach(t =>
      console.log(`  ${t.fName} ${t.lName} — ${t.projectCount} project(s)`)
    );
  } else {
    console.log('  No data yet.');
  }

  // —— QUERY 3: DISTINCT — list unique countries in person table
  console.log('\n── QUERY 3: Unique countries ──');

  const [distinctCountries] = await pool.query(`
    SELECT DISTINCT country
    FROM person
    ORDER BY country ASC
  `);

  distinctCountries.forEach(row =>
    console.log(`  ${row.country || 'N/A'}`)
  );

  // —— QUERY 4: DELETE — remove persons with no city set
  console.log('\n── QUERY 4: Delete persons with no city ──');

  const [deleteResult] = await pool.query(`
    DELETE FROM person
    WHERE city IS NULL OR city = ''
  `);

  console.log(`  Deleted ${deleteResult.affectedRows} person(s) with no city.`);

  // —— QUERY 5: UPDATE — update email for person with id = 1
  console.log('\n── QUERY 5: Update email for person with id = 1 ──');

  const [updateResult] = await pool.query(`
    UPDATE person p SET p.email = 'test@updated.com' where p.idperson = 1 ;
  `);
  console.log(`  Updated ${updateResult.affectedRows} person(s) email(s).`);


  // ======================================== TASK  ======================================================

  // 1- Show persons who are enrolled in more than 2 courses, display their full name and course count
  console.log('\n── TASK QUERY 1: Persons with more than 2 courses ──');

  const [taskQ1] = await pool.query(`
    SELECT p.fName, p.lName , COUNT(c.idcourse) AS courseCount
    FROM person p
    LEFT JOIN course c ON c.person_idperson = p.idperson
    GROUP BY p.idperson
    HAVING courseCount > 2
    ORDER BY courseCount DESC, fName ASC
  `);

  if (taskQ1.length > 0) {
    taskQ1.forEach(row =>
      console.log(`   ${row.fName} ${row.lName} -> ${row.courseCount} course(s)`)
    );
  } else {
    console.log('  No data.');
  }

  // 2- list each distinct country and the number of persons in it, only show countries with more than 2 persons
  console.log('\n── TASK QUERY 2: Countries with more than 2 persons ──');

  const [taskQ2] = await pool.query(`
    SELECT p.country, COUNT(p.idperson) AS personCount
    FROM person p
    WHERE p.country IS NOT NULL AND p.country != ''
    GROUP BY p.country
    HAVING personCount > 2
    ORDER BY p.country ASC
  `);

  if (taskQ2.length > 0) {
    taskQ2.forEach(row =>
      console.log(`  ${row.country} -> ${row.personCount} person(s)`)
    );
  } else {
    console.log('  No data.');
  }

  // 3- Update the email of all persons who have at least one project, set it to their firstName + lastName + '@company.com
  console.log('\n── TASK QUERY 3: Update email for persons with at least one project ──');

  const [taskQ3] = await pool.query(`
    UPDATE person p
    SET p.Email = CONCAT(LOWER(p.fName), LOWER(p.lName), '@company.com')
    WHERE p.idperson IN (
      SELECT DISTINCT pr.person_idperson
      FROM project pr
    )
  `);

  console.log(`  Updated ${taskQ3.affectedRows} person(s) email(s).`);

  // 4- Delete all courses that belong to persons from a specific country
  console.log('\n── TASK QUERY 4: Delete courses for a specific country ──');

  const countryToDelete = 'UK'; // ==> can be changed from here as it's hardcoded 
  const [taskQ4] = await pool.query(`
    DELETE FROM course
    WHERE person_idperson IN (
      SELECT p.idperson
      FROM person p
      WHERE p.country = ?
    )
  `, [countryToDelete]);

  console.log(`  Country: ${countryToDelete}; deleted ${taskQ4.affectedRows} course(s).`);

  // 5- Show each country and the average number of languages spoken by persons from that country, only show countries where the average is more than 1
  console.log('\n── TASK QUERY 5: Countries where average languages > 1 ──');

  const [taskQ5] = await pool.query(`
    SELECT t.country, AVG(t.languageCount) AS avgLanguages
    FROM (
      SELECT p.idperson, p.country, COUNT(l.idlanguage) AS languageCount
      FROM person p
      LEFT JOIN language l ON l.person_idperson = p.idperson
      WHERE p.country IS NOT NULL AND p.country != ''
      GROUP BY p.idperson, p.country
    ) t
    GROUP BY t.country
    HAVING AVG(t.languageCount) > 1
    ORDER BY avgLanguages DESC
  `);

  if (taskQ5.length > 0) {
    taskQ5.forEach(row =>
      console.log(`  ${row.country} -> ${Number(row.avgLanguages).toFixed(2)} language(s) on average`)
    );
  } else {
    console.log('  No data.');
  }


  await pool.end();
}

runQueries().catch(err => console.error('Error:', err.message));
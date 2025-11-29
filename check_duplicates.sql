-- Check for duplicate school codes
SELECT code, COUNT(*) as count 
FROM schools 
GROUP BY code 
HAVING COUNT(*) > 1;

-- Check for duplicate branch codes within same school
SELECT "schoolId", code, COUNT(*) as count 
FROM branches 
GROUP BY "schoolId", code 
HAVING COUNT(*) > 1;

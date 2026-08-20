-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS company_city;
DROP TABLE IF EXISTS company_annual_data;
DROP TABLE IF EXISTS company_founder;
DROP TABLE IF EXISTS founder;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS sector;
DROP TABLE IF EXISTS degree;
DROP TABLE IF EXISTS location;
-- Table: sector (company classification)
CREATE TABLE sector (
    sector_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Table: location (normalized for cities/countries)
CREATE TABLE location (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) ,
    country VARCHAR(100) NOT NULL
);

-- Table: degree (academic qualifications)
CREATE TABLE degree (
    degree_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,            -- e.g., BSE, BCS, MS CS
    department VARCHAR(100),               -- e.g., Software Engineering
    graduation_year YEAR
);

-- Table: founder (entrepreneur details)
CREATE TABLE founder (
    founder_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender ENUM('Male','Female','Other'),
    degree_id INT,                         -- FK to degree table
    FOREIGN KEY (degree_id) REFERENCES degree(degree_id)
);

-- Table: company (main company details)
CREATE TABLE company (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    status VARCHAR(50),                    -- e.g., Operational, Discontinued
    status_reason TEXT,                    -- reason if discontinued
    since_date DATE,                        -- original founding date (full date if available)
    founded_year YEAR,                      -- founding year (for yearly data tracking)
    discontinued_date DATE,
    sector_id INT,
    headquarters_location_id INT,           -- FK to location table
    branches_count INT,
    description TEXT,
    FOREIGN KEY (sector_id) REFERENCES sector(sector_id),
    FOREIGN KEY (headquarters_location_id) REFERENCES location(location_id)
);

-- Table: company_founder (many-to-many relationship)
CREATE TABLE company_founder (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    founder_id INT,
    role VARCHAR(50),                       -- e.g., CEO, Co-founder
    FOREIGN KEY (company_id) REFERENCES company(company_id),
    FOREIGN KEY (founder_id) REFERENCES founder(founder_id)
);

-- Table: company_city (branches in multiple locations)
CREATE TABLE company_city (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    location_id INT,
    FOREIGN KEY (company_id) REFERENCES company(company_id),
    FOREIGN KEY (location_id) REFERENCES location(location_id)
);

-- Table: company_annual_data (yearly revenue and employee counts)
CREATE TABLE company_annual_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    year YEAR,
    revenue_exact DECIMAL(15, 2),           -- exact revenue if available
    revenue_min DECIMAL(15, 2),             -- optional: minimum revenue for scale
    revenue_max DECIMAL(15, 2),             -- optional: maximum revenue for scale
    employee_count INT,
    FOREIGN KEY (company_id) REFERENCES company(company_id)
);


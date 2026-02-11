// Script to convert schools JSON to TypeScript format
const fs = require('fs');

const schoolsData = JSON.parse(fs.readFileSync('/Users/d4-ceo/Downloads/food-city.schools.json', 'utf8'));

// Helper function to generate ID from name
function generateId(name) {
  // Extract the area code in brackets if present
  const match = name.match(/^\[([^\]]+)\]/);
  if (match) {
    const areaCode = match[1].toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[\/\\]/g, '-');
    return areaCode;
  }
  // Fallback: use the school name
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
}

// Helper function to extract English and Arabic names
function extractNames(fullName) {
  const parts = fullName.split('|');
  let nameEn = fullName;
  let nameAr = '';
  
  if (parts.length === 2) {
    nameEn = parts[0].trim();
    nameAr = parts[1].trim();
    
    // Remove the area code prefix from English name
    nameEn = nameEn.replace(/^\[[^\]]+\]\s*/, '');
  } else {
    // Try to split by Arabic pattern
    const arabicMatch = fullName.match(/^([^—]+)—(.+)$/);
    if (arabicMatch) {
      nameEn = arabicMatch[1].trim();
      nameAr = arabicMatch[2].trim();
      nameEn = nameEn.replace(/^\[[^\]]+\]\s*/, '');
    } else {
      nameEn = fullName.replace(/^\[[^\]]+\]\s*/, '');
    }
  }
  
  return { nameEn, nameAr };
}

// Helper function to extract area from name
function extractArea(fullName) {
  const match = fullName.match(/^\[([^\]]+)\]/);
  if (match) {
    const code = match[1];
    // Extract the area name (everything after the dash and number)
    const areaMatch = code.match(/^[^-]+-\s*\d+\]?\s*(.+)?$/);
    if (areaMatch && areaMatch[1]) {
      return areaMatch[1];
    }
    // Try to extract from the code itself
    const parts = code.split('-');
    if (parts.length > 0) {
      return parts[0].trim();
    }
  }
  return 'Unknown';
}

// Helper to determine gender
function extractGender(nameEn) {
  if (nameEn.toLowerCase().includes('boys') || nameEn.toLowerCase().includes('للبنين')) {
    return 'Male';
  } else if (nameEn.toLowerCase().includes('girls') || nameEn.toLowerCase().includes('للبنات')) {
    return 'Female';
  }
  return 'Mixed';
}

// Helper to determine academic stage
function extractAcademicStage(nameEn) {
  const lower = nameEn.toLowerCase();
  if (lower.includes('primary') || lower.includes('الابتدائية')) {
    return 'Primary';
  } else if (lower.includes('intermediate') || lower.includes('الإعدادية') || lower.includes('الاعدادية')) {
    return 'Intermediate';
  } else if (lower.includes('secondary') || lower.includes('الثانوية')) {
    return 'Secondary';
  } else if (lower.includes('institute') || lower.includes('معهد') || lower.includes('center') || lower.includes('مركز')) {
    return 'Institute';
  }
  return 'Primary';
}

// Convert each school
const schools = schoolsData
  .filter(school => school.isActive)
  .map((school, index) => {
    const { nameEn, nameAr } = extractNames(school.name);
    const id = generateId(school.name) + '-' + index;
    const area = extractArea(school.name);
    const gender = extractGender(nameEn + ' ' + nameAr);
    const stage = extractAcademicStage(nameEn + ' ' + nameAr);
    
    return {
      id,
      nameEn,
      nameAr,
      region: area,
      area,
      academicStage: stage,
      schoolGender: gender,
      numberOfStudents: 500,
      status: 'active'
    };
  });

// Generate TypeScript code
let output = 'export interface School {\n';
output += '  id: string;\n';
output += '  nameEn: string;\n';
output += '  nameAr: string;\n';
output += '  region: string;\n';
output += '  area: string;\n';
output += '  academicStage: string;\n';
output += '  schoolGender: string;\n';
output += '  numberOfStudents: number;\n';
output += '  status: string;\n';
output += '}\n\n';
output += 'export const SCHOOLS: School[] = [\n';

schools.forEach((school, index) => {
  output += '  {\n';
  output += `    id: "${school.id}",\n`;
  output += `    nameEn: "${school.nameEn}",\n`;
  output += `    nameAr: "${school.nameAr}",\n`;
  output += `    region: "${school.region}",\n`;
  output += `    area: "${school.area}",\n`;
  output += `    academicStage: "${school.academicStage}",\n`;
  output += `    schoolGender: "${school.schoolGender}",\n`;
  output += `    numberOfStudents: ${school.numberOfStudents},\n`;
  output += `    status: "${school.status}",\n`;
  output += '  }' + (index < schools.length - 1 ? ',' : '') + '\n';
});

output += '];\n\n';
output += '/** Get active schools only */\n';
output += 'export const getActiveSchools = (): School[] => {\n';
output += '  return SCHOOLS.filter((s) => s.status === "active");\n';
output += '};\n\n';
output += '/** Get school display name based on language */\n';
output += 'export const getSchoolDisplayName = (school: School, lang: string): string => {\n';
output += '  if (lang === "ar" && school.nameAr) return school.nameAr;\n';
output += '  return school.nameEn;\n';
output += '};\n';

// Write to file
fs.writeFileSync('/Users/d4-ceo/Desktop/feedback-focus/src/lib/schools.ts', output);

console.log(`Converted ${schools.length} schools successfully!`);

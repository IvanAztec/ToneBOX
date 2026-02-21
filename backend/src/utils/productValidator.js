/**
 * Utility to validate if a string looks like a valid printer consumable or model.
 * Helps distinguish between typos/garbage and real market opportunities.
 */
export const validatePotentialProduct = (query) => {
    const cleanQuery = query.trim().toUpperCase();

    // Patterns for typical SKUs in the industry (Refined for high demand in MX)
    const patterns = {
        toner: /^(TN|CF|CE|CB|CC|Q|CRG|MLT-D|TK|MP|DR|TYPE)-?\d+/i,
        ink: /^(C|G|GI|T|PGI|CLI|LC|SERIE-G)-?\d+/i,
        printer: /^(HL|DCP|MFC|PRO|L|M|PIXMA|ECOTANK|DESKJET|LASERJET|OFFICEJET|MP|TASKALFA|AFICIO)-?\d+/i,
        generic: /^[A-Z]{1,4}-?\d{2,5}[A-Z]{0,2}$/i
    };

    let detectedType = null;
    let isPotential = false;

    if (patterns.toner.test(cleanQuery)) {
        detectedType = 'toner';
        isPotential = true;
    } else if (patterns.ink.test(cleanQuery)) {
        detectedType = 'ink';
        isPotential = true;
    } else if (patterns.printer.test(cleanQuery)) {
        detectedType = 'printer';
        isPotential = true;
    }

    // Brands keywords detection (Expanded for MX market)
    const brands = ['BROTHER', 'HP', 'HEWLETT', 'EPSON', 'CANON', 'XEROX', 'SAMSUNG', 'LEXMARK', 'KYOCERA', 'OKIDATA', 'RICOH', 'SHARP', 'TOSHIBA'];
    const detectedBrand = brands.find(brand => cleanQuery.includes(brand));

    if (detectedBrand) isPotential = true;

    return {
        isPotential,
        type: detectedType,
        brand: detectedBrand || 'unknown',
        confidence: isPotential ? (detectedBrand && detectedType ? 'high' : 'medium') : 'low'
    };
};

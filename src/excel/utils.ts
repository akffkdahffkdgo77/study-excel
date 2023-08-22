import * as XLSX from 'xlsx';

const XLSX_OPTIONS = {
    header: 1,
    blankrows: false,
    defval: ''
};

/**
 *  원본 엑셀 파일 데이터 불러오기
 *  @param fileUrl 엑셀 파일 URL
 *  @param sheetNum 시트 번호 (0부터 시작)
 *  @returns string[][]
 */
export function getOriginalExcel(fileUrl: RequestInfo | URL, sheetNum: number) {
    return fetch(fileUrl)
        .then((res) => res.arrayBuffer())
        .then((ab) => {
            const wb = XLSX.read(ab, { type: 'array' });
            const sheetName = wb.SheetNames[sheetNum];
            const ws = wb.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(ws, XLSX_OPTIONS);
        });
}

/**
 *  사용자가 첨부한 엑셀 파일 불러오기
 *  @param file 엑셀 파일
 *  @returns string[][]
 */
export async function getUploadedExcel(file: File) {
    return new Promise((resolve, reject) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = function getExcelData(e) {
                const data = e.target?.result;
                const excelFile = XLSX.read(data, { type: 'binary' });
                const wsName = excelFile.SheetNames[0];
                const ws = excelFile.Sheets[wsName];
                const excelData = XLSX.utils.sheet_to_json(ws, XLSX_OPTIONS) as string[][];
                resolve(excelData);
            };
            reader.readAsBinaryString(file);
        } else {
            reject(new Error('엑셀 파일을 첨부해 주세요.'));
        }
    });
}

/**
 *  사용자가 첨부한 엑셀과 원본 엑셀 파일 양식 비교하기
 *  @param fileUrl 엑셀 파일 URL
 *  @param sheetNum 엑셀 시트 번호
 *  @param columnTotal header column 수
 *  @param file 사용자가 첨부한 엑셀 파일
 *  @returns string[][]
 */
export async function checkFormat(fileUrl: RequestInfo | URL, sheetNum: number, columnTotal: number, file: File) {
    const originalData = (await getOriginalExcel(fileUrl, sheetNum)) as string[][];
    const uploadedData = (await getUploadedExcel(file)) as string[][];

    for (let i = 0; i < columnTotal; i++) {
        for (let j = 0; j < originalData[i].length; j++) {
            if (originalData[i][j] !== uploadedData[i][j]) {
                throw new Error('양식에 맞는 파일을 첨부해 주세요.');
            }
        }
    }

    if (!uploadedData.slice(columnTotal).length) {
        throw new Error('양식에 맞는 파일을 첨부해 주세요.');
    }

    return uploadedData;
}

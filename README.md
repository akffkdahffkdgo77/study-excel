<img src="https://capsule-render.vercel.app/api?section=header&type=waving&height=300&text=Study%20Excel&color=gradient&fontSize=90&animation=fadeIn" alt="" />

![Create React App](https://img.shields.io/badge/create_react_app-303846?style=for-the-badge&logo=createreactapp&logoColor=09D3AC)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

![Yarn](https://img.shields.io/badge/yarn-%232C8EBB.svg?style=for-the-badge&logo=yarn&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Airbnb](https://img.shields.io/badge/Airbnb-%23ff5a5f.svg?style=for-the-badge&logo=Airbnb&logoColor=white)
![Prettier](https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E)

## 프로젝트 실행

```
yarn install
yarn start
```

## 프로젝트 데모

<img width="1500" alt="sample" src="https://github.com/akffkdahffkdgo77/study-excel/assets/52883505/4d7d2f88-235b-4553-ad41-8b912301d086">

## TIL

### useExcel Custom Hook

- 첨부된 엑셀 파일 형식 검사
- 원본 파일과 첨부된 파일 양식 검사
- 첨부된 엑셀 파일로부터 데이터 추출

```jsx
const VALID_FILE_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

type PropsType<T> = {
    fileUrl: RequestInfo | URL;                        // 원본 파일
    sheetNum: number;                                  // 엑셀 시트 번호 (사용자가 입력한 값이 저장된 시트 번호)
    headerRowNum: number;                              // 엑셀 컬럼 번호 (몇 번째 행까지 컬럼 명으로 사용되었는지)
    skipRowNum: number;                                // 몇 번째 행부터 데이터 가공할지
    errorMessage?: string;                             // 기본 에러 메시지
    onDataProcess: (data: string[][]) => Promise<T[]>; // 데이터 처리 함수
    onSuccess?: (dataList: T[]) => void;               // 성공 처리 함수
    onError?: (message: string) => void;               // 실패 처리 함수
};
type ReturnType<T> = [T[], (e: React.ChangeEvent<HTMLInputElement>) => void];

function useExcel<T>(props: PropsType<T>): ReturnType<T> {
    const { fileUrl, sheetNum, headerRowNum, skipRowNum, onDataProcess, onSuccess, onError, errorMessage } = props;
    const [dataList, setDataList] = useState<T[]>([]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (e.currentTarget.files) {
                const file = e.currentTarget.files[0];

                // 파일 확장자 확인
                if (!VALID_FILE_TYPES.includes(file.type)) {
                    throw new Error('양식에 맞는 파일을 첨부해 주세요');
                }

                // 원본 파일과 첨부한 엑셀 파일 양식 비교
                const rawDataList = await checkFormat(fileUrl, sheetNum, headerRowNum, file);

                // 첨부한 엑셀 파일로부터 데이터 추출하기
                const excelList = await onDataProcess(rawDataList.slice(skipRowNum));
                setDataList(excelList);

                if (onSuccess) {
                    onSuccess(excelList);
                }
            }
        } catch (error) {
            let message = errorMessage ?? '양식에 맞는 파일을 첨부해 주세요.';
            if (error instanceof Error) {
                message = error.message;
            }

            if (onError) {
                onError(message);
            }
        }
    };

    return [dataList, handleFile];
}
```

### Excel Upload

#### 사용자가 첨부한 엑셀 파일 내용 추출하기

- **XLSX** 라이브러리를 사용
- 파일 형식 및 기타 유효성 체크가 이미 완료된 상태
  
```
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
```

#### 원본 엑셀 파일 불러오기

- **fetch** 를 사용해서 프로젝트 폴더에 저장된 원본 엑셀을 불러옴

```jsx
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
```

#### 사용자가 첨부한 엑셀 파일과 원본 엑셀 파일 양식 비교하기

- [ ] **컬럼 명** 이 같은지 확인
- [ ] **컬럼 수** 가 같은지 확인

```jsx
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
```

### Data Process

#### 데이터 가공하기

- **yup** 라이브러리를 사용해서 사용자 입력 값 유효성 검사
- 검사를 통과하지 못한다면 에러 발생
<img width="500" alt="fail alert example" src="https://github.com/akffkdahffkdgo77/study-excel/assets/52883505/79ddbb2a-e1de-4fe7-810b-b217c11e8a3e">

```jsx
const schema = object().shape({
    idx: number().notRequired(),
    name: string().max(100, '이름은 최대 100자까지 입력 가능합니다.').required('이름을 입력해 주세요.'),
    title: string().max(500, '제목은 최대 500자까지 입력 가능합니다.').required('제목을 입력해 주세요.'),
    description: string().max(1000, '설명은 최대 1000자까지 입력 가능합니다.').required('설명을 입력해 주세요.')
});
```

```jsx
// onDataProcess
const finalList = [];
for (let excelIdx = 0; excelIdx < dataList.length; excelIdx++) {
    const [name, title, description] = dataList[excelIdx];
    const obj = { idx: excelIdx, name, title, description };
    await schema.validate(obj);
    finalList.push(obj);
}
return finalList;
```

```jsx
// 원본 파일과 첨부한 엑셀 파일 양식 비교
const rawDataList = await checkFormat(fileUrl, sheetNum, headerRowNum, file);

// 첨부한 엑셀 파일로부터 데이터 추출하기
const excelList = await onDataProcess(rawDataList.slice(skipRowNum));
setDataList(excelList);
```

### Excel Export

#### 샘플 파일 다운로드

- **public** 폴더에 **sample.xlsx** 파일 추가

```jsx
<a href="/sample.xlsx" download>
    샘플 다운로드
</a>
```

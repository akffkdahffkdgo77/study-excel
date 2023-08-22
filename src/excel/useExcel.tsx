import { useState } from 'react';

import { checkFormat } from './utils';

const VALID_FILE_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

type PropsType<T> = {
    fileUrl: RequestInfo | URL;
    sheetNum: number;
    headerRowNum: number;
    skipRowNum: number;
    errorMessage?: string;
    onDataProcess: (data: string[][]) => Promise<T[]>;
    onSuccess?: (dataList: T[]) => void;
    onError?: (message: string) => void;
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

export default useExcel;

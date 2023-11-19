import { number, object, string } from 'yup';

import useExcel from 'excel/useExcel';

import OriginalExcelFile from './original.xlsx';

type DataType = {
    idx: number;
    name: string;
    title: string;
    description: string;
};

const schema = object().shape({
    idx: number().notRequired(),
    name: string().max(100, '이름은 최대 100자까지 입력 가능합니다.').required('이름을 입력해 주세요.'),
    title: string().max(500, '제목은 최대 500자까지 입력 가능합니다.').required('제목을 입력해 주세요.'),
    description: string().max(1000, '설명은 최대 1000자까지 입력 가능합니다.').required('설명을 입력해 주세요.')
});

export default function Excel() {
    const [excelData, handleFile] = useExcel<DataType>({
        fileUrl: OriginalExcelFile,
        sheetNum: 0,
        headerRowNum: 1,
        skipRowNum: 1,
        async onDataProcess(dataList) {
            const finalList = [];
            for (let excelIdx = 0; excelIdx < dataList.length; excelIdx++) {
                const [name, title, description] = dataList[excelIdx];
                const obj = { idx: excelIdx, name, title, description };
                await schema.validate(obj);
                finalList.push(obj);
            }
            return finalList;
        },
        onSuccess(dataList) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(dataList, null, 2));
        },
        onError(message) {
            // eslint-disable-next-line no-alert
            alert(message);
        }
    });

    return (
        <div className="relative min-h-screen w-full">
            <header className="sticky left-0 right-0 top-0 z-10 w-full border-b border-gray-200 bg-white py-5">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            window.location.reload();
                        }}
                        className="whitespace-nowrap rounded-md border border-red-500 px-2 py-1 text-xl font-bold text-red-500"
                    >
                        Reset
                    </button>
                    <div className="flex w-full flex-col items-end gap-2.5">
                        <label htmlFor="file-upload" className="cursor-pointer rounded-md border border-black px-2 py-1">
                            파일 업로드
                            <input
                                hidden
                                id="file-upload"
                                type="file"
                                accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFile}
                                onClick={(e) => (e.currentTarget.value = '')}
                            />
                        </label>
                        <a href="/sample.xlsx" download className="w-fit flex-none cursor-pointer rounded-md border border-blue-500 px-2 py-1 text-xs font-bold text-blue-500">
                            샘플 다운로드
                        </a>
                    </div>
                </div>
            </header>
            <div className="mx-auto mt-10 w-full max-w-3xl overflow-hidden rounded-lg border border-gray-100 bg-white shadow-md">
                <table className="w-full whitespace-nowrap">
                    <thead className="border-gray-140 h-14 w-full border-b">
                        <tr className="h-14 w-full">
                            <th>NO</th>
                            <th>이름</th>
                            <th>제목</th>
                            <th>설명</th>
                        </tr>
                    </thead>
                    <tbody>
                        {excelData.length ? (
                            excelData.map((data) => (
                                <tr key={data.idx} className="h-12 border-b border-gray-100 last-of-type:border-b-0 hover:bg-gray-200">
                                    <td align="center" width={50}>
                                        {data.idx}
                                    </td>
                                    <td align="center">{data.name}</td>
                                    <td align="center">{data.title}</td>
                                    <td align="center">{data.description}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="h-[300px]">
                                <td align="center" colSpan={4}>
                                    데이터가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

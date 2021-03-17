import getInfo from '../_utils/aws/cloudformation_getInfo'
type StackStatus =
    | 'CREATE_IN_PROGRESS'
    | 'CREATE_FAILED'
    | 'CREATE_COMPLETE'
    | 'ROLLBACK_IN_PROGRESS'
    | 'ROLLBACK_FAILED'
    | 'ROLLBACK_COMPLETE'
    | 'DELETE_IN_PROGRESS'
    | 'DELETE_FAILED'
    | 'DELETE_COMPLETE'
    | 'UPDATE_IN_PROGRESS'
    | 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS'
    | 'UPDATE_COMPLETE'
    | 'UPDATE_ROLLBACK_IN_PROGRESS'
    | 'UPDATE_ROLLBACK_FAILED'
    | 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'
    | 'UPDATE_ROLLBACK_COMPLETE'
    | 'REVIEW_IN_PROGRESS'
    | 'IMPORT_IN_PROGRESS'
    | 'IMPORT_COMPLETE'
    | 'IMPORT_ROLLBACK_IN_PROGRESS'
    | 'IMPORT_ROLLBACK_FAILED'
    | 'IMPORT_ROLLBACK_COMPLETE'

const isInProgress = (x: StackStatus) => x.includes('PROGRESS')
const failed = (x: StackStatus) => x.includes('FAIL')
const complete = (x: StackStatus) => x.includes('COMPLETE')

const timesMap = {
    0: 1000,
    1: 1000,
    2: 1000,
    3: 1000,
    4: 1000,
    5: 1000
}

const wait = (time: number) => new Promise((r: any) => setTimeout(() => r(), time))

const showStatus = async (getInfo:any, times:number): Promise<any>  => {
    let data
    try {
        data = await getInfo()
    } catch (e) {
        if (times > 0 && e.message.includes('does not exist')) {
            return {
                status: 'success',
                url: '',
                apiKey: ''
            }
        }

        if (times === 0 && e.message.includes('does not exist')) {
            throw new Error('Rise project does not exist')
        }
    }
    const status = data.StackStatus
    const reason = data.StackStatusReason

    if (isInProgress(status)) {
        if (times > 20) {
            return {
                status: 'in progress',
                reason
            }
        }

        const time = times < 6 ? 1000 : 5000
        await wait(time)
        return await showStatus(getInfo, times + 1)
    }

    if (failed(status)) {
        return {
            status: 'fail',
            reason
        }
    }

     return {
         status: 'fail',
         message: 'Unrecognized status'
     }
}



export default async (AWS: any, name: string) => {
    const info = async () => await getInfo(AWS, name)

    return await showStatus(info, 0)
}

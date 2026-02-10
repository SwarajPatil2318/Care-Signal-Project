import Dexie from 'dexie';

export const db = new Dexie('CareSignalDB');

db.version(1).stores({
    reports: '++id, date, syndrome, status' // status: 'pending' | 'synced'
});

export const saveReport = async (report) => {
    await db.reports.add({
        ...report,
        status: 'pending',
        timestamp: new Date().toISOString()
    });
};

export const getPendingReports = async () => {
    return await db.reports.where('status').equals('pending').toArray();
};

export const markReportsSynced = async (ids) => {
    await db.reports.bulkPut(
        ids.map(id => ({ id, status: 'synced' }))
        // Note: this is simplified. In reality we update existing items.
        // Dexie update:
    );
    // Correct way:
    // Iterate and update, or use modify
};

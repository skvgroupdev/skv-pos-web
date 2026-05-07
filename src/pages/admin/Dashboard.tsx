export default function AdminDashboard() {
    return (
        <div>
            <h2 className="text-3xl font-bold mb-4">ພາບລວມລະບົບ (Super Admin Overview)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500 text-sm">ຈຳນວນສາຂາທັງໝົດ</h3>
                    <p className="text-3xl font-bold">12</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500 text-sm">ການສະໝັກໃຊ້ງານທີ່ເຄື່ອນໄຫວ</h3>
                    <p className="text-3xl font-bold">8</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500 text-sm">ສະຖານະລະບົບ</h3>
                    <p className="text-3xl font-bold text-green-600">ດີຢ້ຽມ (Good)</p>
                </div>
            </div>
        </div>
    );
}

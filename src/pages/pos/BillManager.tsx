import AdminBills from "@/pages/shop/AdminBills";
import { useAuthStore } from "@/store/useAuthStore";

export default function BillManager() {
    const { user } = useAuthStore();

    return (
        <AdminBills
            cashierId={user?.id}
            title="ບິນຂາຍຂອງຂ້ອຍ"
            subtitle="ສະແດງສະເພາະບິນແລະລາຍການຂາຍຂອງຜູ້ໃຊ້ທີ່ກຳລັງ Login"
            queryKeyPrefix="pos"
            useActivitySummary
            showReturnsButton={false}
            allowActions={false}
            constrainedHeight
            showSensitiveSummary={false}
        />
    );
}

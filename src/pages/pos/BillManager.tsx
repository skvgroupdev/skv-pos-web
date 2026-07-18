import AdminBills from "@/pages/shop/AdminBills";
import { useAuthStore } from "@/store/useAuthStore";

export default function BillManager() {
    const { user } = useAuthStore();

    return (
        <AdminBills
            cashierId={user?.id}
            title="ການຮັບ-ຈ່າຍ / ຄືນສິນຄ້າ"
            subtitle="ໃບບິນຂາຍ, ຮັບຊຳລະໜີ້, ຄືນເງິນ ແລະ ຍົກເລີກ ສະເພາະຂອງພະນັກງານນີ້"
            queryKeyPrefix="pos"
            useActivitySummary
            showReturnsButton={false}
            allowActions={false}
            constrainedHeight
        />
    );
}

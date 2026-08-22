import AdminBills from "@/pages/shop/AdminBills";
import { useAuthStore } from "@/store/useAuthStore";

export default function BillManager() {
    const { user } = useAuthStore();
    const cashierId = user?.id || user?._id;

    return (
        <AdminBills
            cashierId={cashierId}
            title="ໃບບິນ"
            subtitle="ລາຍການໃບບິນ, ການຮັບຊຳລະ, ຄືນເງິນ ແລະ ຍົກເລີກ ສະເພາະຂອງແຄດຊຽນ"
            queryKeyPrefix="pos"
            useActivitySummary
            showReturnsButton
            allowActions
            allowCancelActions
            allowReturnActions={false}
            constrainedHeight
            showSensitiveSummary
        />
    );
}

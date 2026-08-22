import ShopDebts from "@/pages/shop/DebtsNew";
import { useAuthStore } from "@/store/useAuthStore";

export default function DebtManager() {
    const { user } = useAuthStore();
    const cashierId = user?.id || user?._id;

    return (
        <ShopDebts
            cashierId={cashierId}
            title="ຄຸ້ມຄອງໜີ້"
            subtitle="ລູກໜີ້, ບິນຄ້າງ ແລະ ປະຫວັດຮັບເງິນ ສະເພາະຂອງແຄດຊຽນ"
            queryKeyPrefix="pos"
            constrainedHeight
        />
    );
}

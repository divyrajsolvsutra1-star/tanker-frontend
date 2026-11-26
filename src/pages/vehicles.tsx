import CrudModule from "@/components/business/CrudModule";
export default function VehiclesPage(){return <CrudModule title="Vehicle Management" description="Register tanker vehicles and maintain customer and driver information." path="vehicles" fields={[
{name:"vehicleNumber",label:"Vehicle / Tanker Number",required:true},{name:"customerId",label:"Customer ID",required:true},
{name:"driverName",label:"Driver Name"},{name:"driverMobileNumber",label:"Driver Mobile"},
{name:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]}
]}/>}

import CrudModule from "@/components/business/CrudModule";
export default function CustomersPage(){return <CrudModule title="Customers & Companies" description="Manage company and individual customers, credit, terms and opening balances." path="customers" fields={[
{name:"customerType",label:"Customer Type",required:true,options:[{value:"company",label:"Company"},{value:"individual",label:"Individual"}]},
{name:"name",label:"Name",required:true},{name:"ownerName",label:"Owner Name"},
{name:"contactPerson",label:"Contact Person"},{name:"mobileNumber",label:"Mobile"},
{name:"gstNumber",label:"GST Number"},{name:"address",label:"Address"},
{name:"openingBalance",label:"Opening Balance",type:"number",min:0},
{name:"creditLimit",label:"Credit Limit",type:"number",min:0},
{name:"creditPeriod",label:"Credit Period (days)",type:"number",min:0},
{name:"paymentTerms",label:"Payment Terms",required:true,options:[{value:"immediate",label:"Immediate"},{value:"15_days",label:"15 Days"},{value:"30_days",label:"30 Days"},{value:"other",label:"Other"}]},
{name:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]}
]}/>}

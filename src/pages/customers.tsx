import CrudModule from "@/components/business/CrudModule";
export default function CustomersPage(){return <CrudModule title="Customers & Companies" description="Manage company and individual customers, credit, terms and opening balances." path="customers" fields={[
{name:"customerType",label:"Customer Type",required:true,options:[{value:"company",label:"Company"},{value:"individual",label:"Individual"}]},
{name:"name",label:"Name",required:true},{name:"ownerName",label:"Owner Name"},
{name:"contactPerson",label:"Contact Person"},
{name:"mobileNumber",label:"Mobile",type:"tel",inputMode:"numeric",maxLength:10,pattern:"[6-9][0-9]{9}",validationMessage:"Enter a valid 10-digit mobile number (starting 6-9)."},
{name:"gstNumber",label:"GST Number",maxLength:15,pattern:"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]",validationMessage:"Enter a valid 15-character GSTIN."},
{name:"address",label:"Address"},
{name:"openingBalance",label:"Opening Balance",type:"number",min:0},
{name:"creditLimit",label:"Credit Limit",type:"number",min:0},
{name:"creditPeriod",label:"Credit Period (days)",type:"number",min:0},
{name:"paymentTerms",label:"Payment Terms",required:true,options:[{value:"immediate",label:"Immediate"},{value:"15_days",label:"15 Days"},{value:"30_days",label:"30 Days"},{value:"other",label:"Other"}]},
{name:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]}
]}/>}

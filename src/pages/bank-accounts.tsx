import CrudModule from "@/components/business/CrudModule";
export default function BankAccountsPage(){return <CrudModule title="Cash & Bank Accounts" description="Manage bank accounts and opening balances." path="bank-accounts" fields={[
{name:"bankName",label:"Bank Name",required:true},{name:"accountName",label:"Account Name",required:true},
{name:"accountNumber",label:"Account Number"},{name:"ifsc",label:"IFSC"},
{name:"openingBalance",label:"Opening Balance",type:"number"},
{name:"active",label:"Active",options:[{value:"true",label:"Active"},{value:"false",label:"Inactive"}]}
]}/>}

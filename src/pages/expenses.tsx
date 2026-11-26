import CrudModule from "@/components/business/CrudModule";
export default function ExpensesPage(){return <CrudModule title="Expense Management" description="Record and manage business expenses." path="expenses" fields={[
{name:"expenseDate",label:"Expense Date",type:"date",required:true},
{name:"category",label:"Category",required:true,options:["Electricity","Water","Rent","Maintenance","Diesel / Fuel","Machinery Repair","Office Expenses","Other Expenses"].map(v=>({value:v,label:v}))},
{name:"description",label:"Description"},{name:"amount",label:"Amount",type:"number",required:true,min:0},
{name:"paymentMode",label:"Payment Mode",required:true,options:[{value:"cash",label:"Cash"},{value:"upi",label:"UPI"},{value:"bank",label:"Bank"}]},
{name:"accountId",label:"Bank Account ID"}
]}/>}

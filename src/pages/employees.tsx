import CrudModule from "@/components/business/CrudModule";
export default function EmployeesPage(){return <CrudModule title="Employees & Washers" description="Manage employees, washers and monthly salary setup." path="employees" fields={[
{name:"name",label:"Employee Name",required:true},
{name:"mobileNumber",label:"Mobile",type:"tel",inputMode:"numeric",maxLength:10,pattern:"[6-9][0-9]{9}",validationMessage:"Enter a valid 10-digit mobile number (starting 6-9)."},
{name:"address",label:"Address"},{name:"details",label:"Employee Details"},
{name:"monthlySalary",label:"Monthly Salary",type:"number",min:0},
{name:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]}
]}/>}

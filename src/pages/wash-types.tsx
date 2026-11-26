import CrudModule from "@/components/business/CrudModule";
export default function WashTypesPage(){return <CrudModule title="Wash Types & Rates" description="Configure wash types and activate or deactivate services." path="wash-types" fields={[
{name:"name",label:"Wash Type",required:true},{name:"description",label:"Description"},
{name:"active",label:"Active",options:[{value:"true",label:"Active"},{value:"false",label:"Inactive"}]}
]}/>}

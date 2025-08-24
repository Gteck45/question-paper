export default async function EditProjectPage({ params }) {
    const { projectId } = await params;


    return (
        <div>
            <h1>Edit Project: {projectId}</h1>
            {/* Add your form or other components here */}
        </div>
    );
}

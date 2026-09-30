export async function onRequestGet(context) {
    try {
        const result = await context.env.DB
            .prepare("SELECT * FROM members ORDER BY id DESC")
            .all();

        return Response.json({
            success: true,
            data: result.results
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}


export async function onRequestPost(context) {
    try {
        const body = await context.request.json();

        const {
            group_id,
            group_name,
            nrc,
            first_name,
            last_name,
            gender,
            phone
        } = body;

        if (!nrc || !first_name || !last_name) {
            return Response.json({
                success: false,
                error: "NRC, first name and last name are required."
            }, { status: 400 });
        }

        const result = await context.env.DB
            .prepare(`
                INSERT INTO members
                (group_id, group_name, nrc, first_name, last_name, gender, phone)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                group_id || null,
                group_name || null,
                nrc,
                first_name,
                last_name,
                gender || null,
                phone || null
            )
            .run();

        return Response.json({
            success: true,
            message: "Member saved successfully.",
            id: result.meta.last_row_id
        });

    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

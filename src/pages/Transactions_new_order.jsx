<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* 1. Points (Amount) - First */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Points (Amount)</label>
        <input
            type="number"
            name="points"
            value={createFormData.points}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
        {createFormData.points && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Formatted: {Number(createFormData.points).toLocaleString('en-IN')}
            </p>
        )}
    </div>

    {/* 2. Receiver Mobile - Second */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Mobile</label>
        <input
            type="number"
            name="receiver_mobile"
            value={createFormData.receiver_mobile}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
    </div>

    {/* 3. Receiver Name - Third */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Name</label>
        <input
            type="text"
            name="receiver_name"
            value={createFormData.receiver_name}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
    </div>

    {/* 4. Receiver Branch - Fourth */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Branch</label>
        <select
            name="receiver_branch"
            value={createFormData.receiver_branch}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
            <option value="">Select Receiver Branch</option>
            {branches.map(b => (
                <option key={b._id} value={b._id}>{b.branch_name}</option>
            ))}
        </select>
    </div>

    {/* 5. Sender Branch - Fifth */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Branch</label>
        <select
            name="sender_branch"
            value={createFormData.sender_branch}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
            <option value="">Select Sender Branch</option>
            {branches.map(b => (
                <option key={b._id} value={b._id}>{b.branch_name}</option>
            ))}
        </select>
    </div>

    {/* 6. Sender Name - Sixth */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Name</label>
        <input
            type="text"
            name="sender_name"
            value={createFormData.sender_name}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
    </div>

    {/* 7. Sender Mobile - Seventh */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Mobile</label>
        <input
            type="number"
            name="sender_mobile"
            value={createFormData.sender_mobile}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
    </div>

    {/* 8. Commission - Eighth */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Commission</label>
        <input
            type="number"
            name="commission"
            value={createFormData.commission}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
        {createFormData.commission && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Formatted: {Number(createFormData.commission).toLocaleString('en-IN')}
            </p>
        )}
    </div>

    {/* 9. Narration - Ninth */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Narration</label>
        <input
            type="text"
            name="other_receiver"
            value={createFormData.other_receiver}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
    </div>

    {/* 10. Other Sender (Optional) - Last */}
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Sender (Optional)</label>
        <input
            type="text"
            name="other_sender"
            value={createFormData.other_sender}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
    </div>
</div>

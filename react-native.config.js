module.exports = {
	dependencies: {
		'react-native-permissions': {
			platforms: {
				ios: {
					sourceDir: '../node_modules/react-native-permissions/ios',
					podspec: 'RNPermissions.podspec',
				},
				android: {
					sourceDir: '../node_modules/react-native-permissions/android',
					packageImportPath: 'import com.zoontek.rnpermissions.RNPermissionsPackage;',
					packageInstance: 'new RNPermissionsPackage()',
				},
			},
		},
	},
}; 
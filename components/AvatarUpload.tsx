import { useState, useRef } from "react";
import { Camera, User } from "lucide-react";
import Image from "next/image";
import { enqueueSnackbar } from "notistack";

type AvatarUploadProps = {
	initialImage?: string | null;
	onImageChange?: (file: File | null, imageUrl: string | null) => void;
	size?: number; // ✅ add size prop (in pixels)
};

const AvatarUpload = ({
	initialImage = null,
	onImageChange,
	size = 64, // default 64px (~h-16 w-16)
}: AvatarUploadProps) => {
	const [avatarImage, setAvatarImage] = useState<string | null>(initialImage);
	const [isHovering, setIsHovering] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const removeImage = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		setAvatarImage(null);

		// Reset file input so selecting the same file again will trigger onChange
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}

		if (onImageChange) {
			onImageChange(null, null);
		}
	};

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];

		if (file.size > 5 * 1024 * 1024) {
			enqueueSnackbar("File size should be less than 5MB", {
				variant: "error",
			});
			return;
		}

		if (!file.type.startsWith("image/")) {
			enqueueSnackbar("Please select an image file", { variant: "error" });
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const imageUrl = e.target?.result as string | null;
			setAvatarImage(imageUrl);

			if (onImageChange) {
				onImageChange(file, imageUrl);
			}

			// ✅ Reset input after successful upload (optional but safer)
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		};
		reader.readAsDataURL(file);
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	// const removeImage = (e: React.MouseEvent<HTMLButtonElement>) => {
	//   e.stopPropagation();
	//   setAvatarImage(null);
	//   if (onImageChange) {
	//     onImageChange(null, null);
	//   }
	// };

	return (
		<div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
			<div
				style={{ width: size, height: size }} // ✅ dynamic size
				className="relative rounded-full overflow-hidden cursor-pointer self-center sm:self-auto group"
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
				onClick={triggerFileInput}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleImageUpload}
					className="hidden"
				/>

				{avatarImage ? (
					<>
						<Image
							src={avatarImage}
							alt="Avatar"
							fill
							className="object-cover"
							unoptimized
						/>
						<div
							className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200 ${
								isHovering ? "opacity-100" : "opacity-0"
							}`}
						>
							<Camera className="h-4 w-4 text-white" />
						</div>

						{isHovering && (
							<button
								onClick={removeImage}
								className="absolute top-2 right-1 h-5 w-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
							>
								×
							</button>
						)}
					</>
				) : (
					<div className="w-full h-full bg-secondary hover:bg-secondary/80 text-white flex items-center justify-center transition-colors">
						{isHovering ? (
							<Camera className="h-4 w-4" />
						) : (
							<User className="h-4 w-4" />
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default AvatarUpload;
